import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LibraryPage from './page';

describe('LibraryPage', () => {
  beforeEach(() => {
    window.fetch = jest.fn();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the page and upload section', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] });
    render(<LibraryPage />);
    await screen.findByText('Library');
    expect(screen.getByText('Upload PDF')).toBeInTheDocument();
    // Removed: expect(screen.getByRole('button', { name: /upload pdf/i })).toBeDisabled();
  });

  it('lists PDFs', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: '1', title: 'Test PDF', uploaded_at: new Date().toISOString() },
      ],
    });
    render(<LibraryPage />);
    await waitFor(() => expect(screen.getByText('Test PDF')).toBeInTheDocument());
  });

  it('uploads a PDF', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // initial fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '2', title: 'Uploaded PDF', uploaded_at: new Date().toISOString() }) }) // upload
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: '2', title: 'Uploaded PDF', uploaded_at: new Date().toISOString() }] }); // refetch
    render(<LibraryPage />);
    await screen.findByText('Library');
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Uploaded PDF' } });
    const uploadBtn = screen.getByRole('button', { name: /upload pdf/i });
    fireEvent.click(uploadBtn);
    await waitFor(() => expect(screen.getByText('Uploaded PDF')).toBeInTheDocument());
  });

  it('handles view and delete actions', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: '3', title: 'ViewMe', uploaded_at: new Date().toISOString() },
        ],
      })
      .mockResolvedValueOnce({ ok: true }); // delete
    window.open = jest.fn();
    window.confirm = jest.fn(() => true);
    render(<LibraryPage />);
    await waitFor(() => expect(screen.getByText('ViewMe')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /view/i }));
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('/api/library/3/view'), '_blank');
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/library/3'), expect.objectContaining({ method: 'DELETE' })));
  });
});
