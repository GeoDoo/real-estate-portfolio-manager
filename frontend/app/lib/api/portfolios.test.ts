import { describe, it, expect, jest, afterEach } from "@jest/globals";

// Define types for test data
type MockFunction = jest.MockedFunction<
  (...args: unknown[]) => Promise<unknown>
>;

const mockGet: MockFunction = jest.fn();
const mockPost: MockFunction = jest.fn();

jest.mock("@/lib/api", () => ({
  api: {
    get: mockGet,
    post: mockPost,
  },
}));

describe("portfoliosAPI", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("getAll fetches all portfolios", async () => {
    mockGet.mockResolvedValue({ items: [{ id: "1", name: "A" }] });
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.getAll();
    expect(mockGet).toHaveBeenCalledWith("/api/portfolios");
    expect(result).toEqual([{ id: "1", name: "A" }]);
  });

  it("create posts new portfolio", async () => {
    mockPost.mockResolvedValue({ data: { id: "2", name: "B" } });
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.create("B");
    expect(mockPost).toHaveBeenCalledWith("/api/portfolios", { name: "B" });
    expect(result).toEqual({ id: "2", name: "B" });
  });

  it("getById fetches portfolio by id", async () => {
    mockGet.mockResolvedValue({ data: { id: "3", name: "C" } });
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.getById("3");
    expect(mockGet).toHaveBeenCalledWith("/api/portfolios/3");
    expect(result).toEqual({ id: "3", name: "C" });
  });

  it("getProperties fetches properties for a portfolio", async () => {
    mockGet.mockResolvedValue({ items: [{ id: "p1" }, { id: "p2" }] });
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.getProperties("4");
    expect(mockGet).toHaveBeenCalledWith("/api/portfolios/4/properties");
    expect(result).toEqual([{ id: "p1" }, { id: "p2" }]);
  });

  it("getPortfolioIRR fetches IRR and returns value", async () => {
    mockGet.mockResolvedValue({ irr: 0.123 });
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.getPortfolioIRR("5");
    expect(mockGet).toHaveBeenCalledWith("/api/portfolios/5/irr");
    expect(result).toBe(0.123);
  });

  it("getPortfolioIRR returns null if irr is missing", async () => {
    mockGet.mockResolvedValue({});
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.getPortfolioIRR("6");
    expect(result).toBeNull();
  });

  it("getPortfolioIRR returns null on error", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.getPortfolioIRR("7");
    expect(result).toBeNull();
  });

  it("getPortfolioPayback fetches payback data successfully", async () => {
    const paybackData = { simple_payback: 3.5, discounted_payback: 4.2 };
    mockGet.mockResolvedValue(paybackData);
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.getPortfolioPayback("8");
    expect(mockGet).toHaveBeenCalledWith("/api/portfolios/8/payback");
    expect(result).toEqual(paybackData);
  });

  it("getPortfolioPayback returns null on error", async () => {
    mockGet.mockRejectedValue(new Error("fail"));
    const { portfoliosAPI } = await import("./portfolios");
    const result = await portfoliosAPI.getPortfolioPayback("9");
    expect(result).toBeNull();
  });
});
