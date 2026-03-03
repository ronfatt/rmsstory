import { notFound } from "next/navigation";
import { BookEditor } from "@/components/admin/book-editor";
import { getEditableBook } from "@/lib/admin-book-editor";

export default async function AdminBookEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getEditableBook(id);

  if (!book) {
    notFound();
  }

  return (
    <main className="pb-16 pt-8 md:pb-24">
      <div className="page-shell">
        <BookEditor book={book} />
      </div>
    </main>
  );
}
