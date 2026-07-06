"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { fetchNZImage, type NZImage } from "@/lib/nz-image";

const SWAP_INTERVAL_MS = 10000;
const RETRY_DELAY_MS = 1000;
const QUEUE_SIZE = 5; // images buffered ahead of the one on screen

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
  const [displayed, setDisplayed] = useState<NZImage | null>(null);

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

        const image = await fetchNZImage(signal).catch(() => null);
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

    // Consumer: show the head of the queue every SWAP_INTERVAL_MS.
    (async function consume() {
      while (!cancelled) {
        while (!cancelled && queue.length === 0) await hasItem.wait();
        if (cancelled) return;

        const entry = queue.shift()!;
        hasSpace.open();
        setDisplayed(entry.image);
        await sleep(SWAP_INTERVAL_MS, signal).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      hasItem.open(); // wake any waiting loop so it observes `cancelled`
      hasSpace.open();
    };
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        {displayed && (
          <div>
            <Image
              className={styles.image}
              src={displayed.largeThumbnailUrl}
              alt={displayed.title}
              fill
              unoptimized
            />
            <div className={styles.text}>
              <h2>{displayed.title}</h2>
              {displayed.description && (
                <p className={styles.description}>{displayed.description}</p>
              )}
              {displayed.displayCollection && (
                <p className={styles.collection}>{displayed.displayCollection}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
