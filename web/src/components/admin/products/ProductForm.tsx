"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Define validation schema
export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  discount: z.number().min(0, "Discount must be positive"),
  ratingFromManufacturer: z.number().min(0).max(5, "Rating must be between 0-5").nullable().optional(),
});

export type ProductFormInputs = z.infer<typeof productFormSchema>;

export interface ProductFormProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    price: number;
    discount: number;
    ratingFromManufacturer?: number | null;
  };
  onSubmit?: (data: ProductFormInputs) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProductForm({
  product,
  onSubmit: externalOnSubmit,
  isSubmitting = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInputs>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      discount: product.discount,
      ratingFromManufacturer: product.ratingFromManufacturer,
    },
  });

  const onSubmit: SubmitHandler<ProductFormInputs> = async (data) => {
    if (externalOnSubmit) {
      await externalOnSubmit(data);
    }
  };

  useEffect(() => {
    reset({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      discount: product.discount,
      ratingFromManufacturer: product.ratingFromManufacturer,
    });
  }, [product, reset]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-neutral-900 shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <Input {...register("name")} placeholder="Enter product name" />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            {...register("description")}
            placeholder="Enter product description"
            rows={4}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <Input {...register("category")} placeholder="Enter category" />
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Price & Discount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price (GHS)</label>
            <Input
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.price.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Discount (%)
            </label>
            <Input
              type="number"
              step="0.01"
              {...register("discount", { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.discount && (
              <p className="text-red-500 text-sm mt-1">
                {errors.discount.message}
              </p>
            )}
          </div>
        </div>

        {/* Rating From Manufacturer */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Rating From Manufacturer (Optional)
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="5"
            {...register("ratingFromManufacturer", {
              setValueAs: (v) => (v === "" ? null : parseFloat(v)),
            })}
            placeholder="e.g. 4.5"
          />
          {errors.ratingFromManufacturer && (
            <p className="text-red-500 text-sm mt-1">
              {errors.ratingFromManufacturer.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Product...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </div>
  );
}
