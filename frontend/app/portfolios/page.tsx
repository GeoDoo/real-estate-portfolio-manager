"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { portfoliosAPI, Portfolio } from "@/lib/api/portfolios";
import Button from "@/components/Button";
import PageContainer from "@/components/PageContainer";
import Breadcrumbs from "@/components/Breadcrumbs";

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
      <Breadcrumbs last="Portfolios" />
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: "var(--foreground)" }}
      >
        Portfolios
      </h1>
      <form onSubmit={handleAdd} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Portfolio name"
          className="input flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !newName.trim()}>
          Add
        </Button>
      </form>
      {error && (
        <div style={{ color: "var(--error)" }} className="mb-4">
          {error.includes('CORS') || error.includes('Network')
            ? 'Could not connect to backend. Check CORS or server status.'
            : error}
        </div>
      )}
      {loading && portfolios.length === 0 ? (
        <div style={{ color: "var(--text-muted)" }}>Loading...</div>
      ) : portfolios.length === 0 ? (
        <div style={{ color: "var(--text-muted)" }}>No portfolios found.</div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {portfolios.map((p) => (
            <li key={p.id}>
              <Link
                href={`/portfolios/${p.id}`}
                className="card flex items-center justify-between px-6 py-5 text-lg font-medium hover:shadow-md transition-all group"
              >
                <span style={{ color: "var(--foreground)" }}>{p.name}</span>
                <span
                  className="transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
