"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AiOutlineDelete } from "react-icons/ai";
import { FiEdit3 } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/hooks/use-analytics";

export interface AdminProductsTableProps {
  products: any[];
  onDeleteProduct?: (productId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function AdminProductsTable({ products, onDeleteProduct }: AdminProductsTableProps) {
  const router = useRouter();
  const { trackAdminAction } = useAnalytics();

  const deleteProduct = async (productId: string) => {
    if (onDeleteProduct) {
      try {
        await onDeleteProduct(productId);
        trackAdminAction("delete_product", productId);
        toast.success("Product deleted");
      } catch (err) {
        toast.error("Failed to delete product");
        console.error(err);
      }
    }
  };

  const editProduct = (slug: string) => {
    trackAdminAction("edit_product_navigate", slug);
    router.push(`/admin/products/${slug}/edit`);
  };

  return (
    <div className="md:max-w-7xl px-4 py-10 mb-8 md:mb-24">
      <h1 className="text-2xl font-bold mb-4">Admin Products Page</h1>
      <p className="text-gray-500">Manage your products here.</p>

      <div className="mt-8">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead>S/N</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product, index) => (
              <TableRow key={product.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell className="flex gap-2">
                  <button
                    onClick={() => editProduct(product.slug)}
                    className="cursor-pointer text-gray-500 hover:text-black dark:hover:text-white"
                    title="Edit product"
                  >
                    <FiEdit3 />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="cursor-pointer text-red-500 hover:text-red-700"
                    title="Delete product"
                  >
                    <AiOutlineDelete />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
