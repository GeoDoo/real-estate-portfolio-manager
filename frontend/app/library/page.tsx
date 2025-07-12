"use client";

import { useState, useEffect } from "react";
import Button from "@/components/Button";
import PageContainer from "@/components/PageContainer";
import Breadcrumbs from "@/components/Breadcrumbs";

interface LibraryItem {
  id: string;
  title: string;
  uploaded_at: string;
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost:5050/api/library");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch library items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setTitle(file.name.replace(".pdf", ""));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title);

    try {
      const response = await fetch("http://localhost:5050/api/library", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSelectedFile(null);
        setTitle("");
        fetchItems();
      } else {
        const error = await response.json();
        alert(error.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`http://localhost:5050/api/library/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleView = (id: string) => {
    window.open(`http://localhost:5050/api/library/${id}/view`, "_blank");
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto p-6">Loading...</div>;
  }

  return (
    <PageContainer>
      <div>
        <Breadcrumbs last="Library" />
        <h1
          className="text-3xl font-bold mb-8"
          style={{ color: "var(--foreground)" }}
        >
          Library
        </h1>
        {/* Upload Section */}
        <div className="bg-card p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                data-testid="file-input"
              />
            </div>
            {selectedFile && (
              <div>
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            )}
            {selectedFile && (
              <Button
                onClick={handleUpload}
                disabled={uploading || !title.trim()}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload PDF"}
              </Button>
            )}
          </div>
        </div>
        {/* Library Items */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-muted">No PDFs uploaded yet.</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-card p-4 rounded-lg flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted">
                    {new Date(item.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleView(item.id)}
                    variant="secondary"
                    size="sm"
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => handleDelete(item.id)}
                    variant="danger"
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
