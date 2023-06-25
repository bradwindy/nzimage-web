import axios from "axios";
import { TypedJSON } from "typedjson";
import { NZImageResult } from "@/models/nz-image-result";

export class RequestManager {
  private headers: object = {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  };

  async fetchImage(
    setResult: React.Dispatch<React.SetStateAction<NZImageResult | null>>
  ) {
    try {
      const response = await axios.get(
        "https://v3t4byxuld.execute-api.ap-southeast-2.amazonaws.com/image",
        this.headers
      );

      const data = this.parseResponse(response.data);
      setResult(() => data);
    } catch (error) {
      console.log(error);
    }
  }

  parseResponse(body: string): NZImageResult {
    const recordsSerializer = new TypedJSON(NZImageResult);
    const result = recordsSerializer.parse(body);

    if (result) {
      return result;
    } else {
      throw "temp error";
    }
  }
}
