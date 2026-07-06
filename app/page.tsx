"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { fetchNZImage, type NZImage } from "@/lib/nz-image";

const SWAP_INTERVAL_MS = 10000;
const RETRY_DELAY_MS = 1000;

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

function preloadImage(url: string): Promise<void> {
  const img = new window.Image();
  img.src = url;
  return img.decode();
}

export default function Home() {
  const [displayed, setDisplayed] = useState<NZImage | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async function loop() {
      while (!cancelled) {
        let next: NZImage | null = null;

        while (!cancelled && next === null) {
          next = await fetchNZImage(controller.signal).catch(() => null);
          if (next === null) {
            await sleep(RETRY_DELAY_MS, controller.signal).catch(() => {});
          }
        }
        if (cancelled || next === null) return;

        try {
          await preloadImage(next.largeThumbnailUrl);
        } catch {
          // Decode failed; fetch a different image immediately.
          continue;
        }
        if (cancelled) return;

        setDisplayed(next);
        await sleep(SWAP_INTERVAL_MS, controller.signal).catch(() => {});
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
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
