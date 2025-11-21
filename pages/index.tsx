import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { useEffect, useState, useMemo, useCallback } from "react";
import { NZImageResult } from "@/models/nz-image-result";
import { RequestManager } from "@/managers/request-manager";

const THIRTY_SECONDS = 30000;

export default function Home() {
  const [result, setResult] = useState<NZImageResult | null>(null);
  const requestManager = useMemo(() => new RequestManager(), []);

  const fetchNewImage = useCallback(() => {
    requestManager.fetchImage(setResult);
  }, [requestManager]);

  useEffect(() => {
    // Fetch initial image
    fetchNewImage();

    // Set up interval to fetch new images every thirty seconds
    const intervalId = setInterval(fetchNewImage, THIRTY_SECONDS);

    // Cleanup function to clear interval when component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNewImage]);

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
          {result && (
            <div>
              <Image
                className={styles.image}
                src={result.largeThumbnailUrl}
                alt={result.title}
                fill
              />
              <div className={styles.text}>
                <h2>{result.title}</h2>
                {result.description && (
                  <p className={styles.description}>{result.description}</p>
                )}
                {result.displayCollection && (
                  <p className={styles.collection}>
                    {result.displayCollection}
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
