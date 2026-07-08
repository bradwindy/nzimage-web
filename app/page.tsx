"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import { fetchNZImage, type NZImage } from "@/lib/nz-image";
import { useSettings } from "@/lib/settings-context";
import { InfoPanel } from "@/components/InfoPanel";
import { SettingsRoot, type SettingsRootHandle } from "@/components/SettingsRoot";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { WelcomeModal } from "@/components/WelcomeModal";

const RETRY_DELAY_MS = 1000;
const QUEUE_SIZE = 5; // images buffered ahead of the one on screen
const SLEEP_POLL_MS = 500; // granularity for picking up a shortened interval mid-wait

type QueueEntry = { image: NZImage; element: HTMLImageElement };

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timeoutId = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

// Re-checks `getMs()` every poll instead of sleeping the full duration up front, so a shortened
// interval (changed mid-wait via settings) takes effect within one poll tick rather than only on
// the next cycle.
async function sleepInterval(signal: AbortSignal, getMs: () => number): Promise<void> {
  const start = Date.now();
  for (;;) {
    const elapsed = Date.now() - start;
    const target = getMs();
    if (elapsed >= target) return;
    await sleep(Math.min(SLEEP_POLL_MS, target - elapsed), signal);
  }
}

function preloadImage(url: string): Promise<HTMLImageElement> {
  const img = new window.Image();
  img.src = url;
  return img.decode().then(() => img);
}

// A one-shot gate that can be awaited and re-opened; condition-variable style.
function createGate() {
  let open!: () => void;
  let promise = new Promise<void>((r) => (open = r));
  return {
    wait: () => promise,
    open: () => {
      open();
      promise = new Promise<void>((r) => (open = r));
    },
  };
}

export default function Home() {
  const { settings } = useSettings();
  const [displayed, setDisplayed] = useState<NZImage | null>(null);
  const settingsRootRef = useRef<SettingsRootHandle>(null);

  // Read inside the async loop via `.current` so an interval change doesn't need to tear down and
  // restart the producer/consumer (which would abort in-flight fetches and drop the buffer).
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Hidden-collection changes DO restart the loop (rare/deliberate; flushes queued now-hidden
  // images and refetches with the new exclude set). Sorted so key order doesn't spuriously churn.
  const hiddenKey = useMemo(
    () => [...settings.hiddenCollections].sort().join("|"),
    [settings.hiddenCollections]
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let cancelled = false;

    const queue: QueueEntry[] = [];
    const hasItem = createGate(); // opened after an item is pushed
    const hasSpace = createGate(); // opened after an item is shifted

    // Producer: keep the queue filled to QUEUE_SIZE with decoded images.
    (async function produce() {
      while (!cancelled) {
        // Block while the queue is full; wake when the consumer frees a slot.
        while (!cancelled && queue.length >= QUEUE_SIZE) await hasSpace.wait();
        if (cancelled) return;

        const image = await fetchNZImage({
          signal,
          exclude: settingsRef.current.hiddenCollections,
        }).catch(() => null);
        if (image === null) {
          // Network/fetch failure: brief backoff, then try a different image.
          await sleep(RETRY_DELAY_MS, signal).catch(() => {});
          continue;
        }

        let element: HTMLImageElement;
        try {
          element = await preloadImage(image.largeThumbnailUrl);
        } catch {
          continue; // Decode failed: skip immediately, fetch another.
        }
        if (cancelled) return;

        queue.push({ image, element });
        hasItem.open();
      }
    })();

    // Consumer: show the head of the queue every settingsRef.current.intervalMs.
    (async function consume() {
      while (!cancelled) {
        while (!cancelled && queue.length === 0) await hasItem.wait();
        if (cancelled) return;

        const entry = queue.shift()!;
        hasSpace.open();

        // Belt-and-suspenders: covers the race where the queue was filled just before a
        // hidden-collections change and the effect restart (below) hasn't drained it yet.
        if (
          entry.image.displayCollection &&
          settingsRef.current.hiddenCollections.includes(entry.image.displayCollection)
        ) {
          continue;
        }

        setDisplayed(entry.image);
        await sleepInterval(signal, () => settingsRef.current.intervalMs).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      hasItem.open(); // wake any waiting loop so it observes `cancelled`
      hasSpace.open();
    };
  }, [hiddenKey]);

  return (
    <main
      className={styles.main}
      onContextMenu={(e) => {
        if (!settings.hideChromeUntilInteract) return;
        e.preventDefault();
        settingsRootRef.current?.reveal();
      }}
    >
      <div className={styles.frame}>
        {displayed ? (
          <div className={styles.imageWrapper}>
            <Image
              className={styles.image}
              src={displayed.largeThumbnailUrl}
              alt={displayed.title}
              fill
              unoptimized
            />
            {settings.showInfoPanel && (
              <div className={styles.text}>
                <InfoPanel image={displayed} />
              </div>
            )}
          </div>
        ) : (
          <LoadingOverlay />
        )}
      </div>
      <SettingsRoot ref={settingsRootRef} />
      <WelcomeModal />
    </main>
  );
}
