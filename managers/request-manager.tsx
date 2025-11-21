import axios from "axios";
import { TypedJSON } from "typedjson";
import { NZImageResult } from "@/models/nz-image-result";

const API_URL = "https://v3t4byxuld.execute-api.ap-southeast-2.amazonaws.com/image";

export class RequestManager {
  async fetchImage(
    setResult: React.Dispatch<React.SetStateAction<NZImageResult | null>>
  ): Promise<void> {
    try {
      const response = await axios.get(API_URL);
      const data = this.parseResponse(response.data);
      setResult(data);
    } catch (error) {
      console.error("Failed to fetch image:", error);
      setResult(null);
    }
  }

  private parseResponse(body: unknown): NZImageResult {
    const serializer = new TypedJSON(NZImageResult);
    const result = serializer.parse(body);

    if (!result) {
      throw new Error("Failed to parse NZImageResult from response");
    }

    return result;
  }
}
