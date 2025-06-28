"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { portfoliosAPI, Portfolio } from "@/lib/api/portfolios";
import Button from "@/components/Button";
import PageContainer from "@/components/PageContainer";

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  async function fetchPortfolios() {
    setLoading(true);
    try {
      const data = await portfoliosAPI.getAll();
      setPortfolios(data);
    } catch {
      setError("Failed to load portfolios");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await portfoliosAPI.create(newName.trim());
      setNewName("");
      await fetchPortfolios();
    } catch {
      setError("Failed to add portfolio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Portfolios</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-8">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Portfolio name"
          className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !newName.trim()}>
          Add
        </Button>
      </form>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading && portfolios.length === 0 ? (
        <div className="text-gray-500">Loading...</div>
      ) : portfolios.length === 0 ? (
        <div className="text-gray-500">No portfolios found.</div>
      ) : (
        <ul className="space-y-3">
          {portfolios.map((p) => (
            <li key={p.id}>
              <Link href={`/portfolios/${p.id}`} className="text-lg text-blue-700 hover:underline">
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
} 