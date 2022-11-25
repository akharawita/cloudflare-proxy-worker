const PREFIX_KV = {
  address: "address:",
};

export type SaveThothResults = {
  balance: string;
  updatedAt: string;
};

export type SavePriceListResults = {
  token: string;
  price: string;
  updatedAt: string;
};

export class ThothKV {
  static async getThoth(address: string) {
    return THOTH.get<SaveThothResults>(`${PREFIX_KV.address}${address}`, {
      type: "json",
    });
  }

  static async saveThoth(address: string, results: SaveThothResults) {
    return THOTH.put(`${PREFIX_KV.address}${address}`, JSON.stringify(results));
  }

  static async getTokenPrices() {
    return THOTH.get<SavePriceListResults>("priceList", {
      type: "json",
    });
  }

  static async saveTokenPrice(results: SavePriceListResults[]) {
    return THOTH.put("priceList", JSON.stringify(results));
  }
}

export const thothKV = new ThothKV();
