import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { NZImageResult } from "@/models/nz-image-result";
import { RequestManager } from "@/managers/request-manager";

const SWAP_INTERVAL = 10000;

export default function Home() {
  const [displayedResult, setDisplayedResult] = useState<NZImageResult | null>(
    null
  );
  const [preloadedResult, setPreloadedResult] = useState<NZImageResult | null>(
    null
  );
  const requestManager = useMemo(() => new RequestManager(), []);
  const isFetchingRef = useRef(false);
  const swapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchNextRef = useRef<(() => void) | null>(null);
  const lastSwapTimeRef = useRef<number>(0);

  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }, []);

  const fetchAndPreloadNextImage = useCallback(async (): Promise<void> => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      // Fetch image metadata from API
      const fetchedResult: NZImageResult | null = await new Promise<NZImageResult | null>((resolve) => {
        requestManager.fetchImage((value) => resolve(value));
      });

      if (!fetchedResult) {
        // If API fetch failed, try again
        isFetchingRef.current = false;
        setTimeout(() => fetchNextRef.current?.(), 1000);
        return;
      }

      // Preload the actual image in the background
      await preloadImage(fetchedResult.largeThumbnailUrl);

      // Image loaded successfully, store it as preloaded and ready to display
      setPreloadedResult(fetchedResult);
      isFetchingRef.current = false;
    } catch (error) {
      // Image failed to load, try fetching a different one
      console.warn("Failed to preload image, fetching another:", error);
      isFetchingRef.current = false;
      // Immediately try to fetch another image
      setTimeout(() => fetchNextRef.current?.(), 500);
    }
  }, [requestManager, preloadImage]);

  // Store the fetch function in a ref so it can be called recursively
  useEffect(() => {
    fetchNextRef.current = fetchAndPreloadNextImage;
  }, [fetchAndPreloadNextImage]);

  const performSwap = useCallback(() => {
    if (preloadedResult) {
      setDisplayedResult(preloadedResult);
      setPreloadedResult(null);
      lastSwapTimeRef.current = Date.now();
      // Immediately start preloading the next image
      fetchAndPreloadNextImage();
    }
  }, [preloadedResult, fetchAndPreloadNextImage]);

  // When preloaded image becomes available, schedule swap based on timing
  useEffect(() => {
    if (!preloadedResult) return;

    const now = Date.now();
    const timeSinceLastSwap = now - lastSwapTimeRef.current;

    // If this is the first image or it's been more than 10 seconds, swap immediately
    if (lastSwapTimeRef.current === 0 || timeSinceLastSwap >= SWAP_INTERVAL) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      performSwap();
    } else {
      // Schedule swap for when 10 seconds will have elapsed
      const remainingTime = SWAP_INTERVAL - timeSinceLastSwap;
      const timeoutId = setTimeout(() => {
        performSwap();
      }, remainingTime);

      swapTimerRef.current = timeoutId;

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [preloadedResult, performSwap]);

  // Start the initial fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAndPreloadNextImage();
  }, [fetchAndPreloadNextImage]);

  return (
    <>
      <Head>
        <title>NZImage</title>
        <meta name="description" content="NZ Image Gallery" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.description}>
          {displayedResult && (
            <div>
              <Image
                className={styles.image}
                src={displayedResult.largeThumbnailUrl}
                alt={displayedResult.title}
                fill
                unoptimized
              />
              <div className={styles.text}>
                <h2>{displayedResult.title}</h2>
                {displayedResult.description && (
                  <p className={styles.description}>
                    {displayedResult.description}
                  </p>
                )}
                {displayedResult.displayCollection && (
                  <p className={styles.collection}>
                    {displayedResult.displayCollection}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
