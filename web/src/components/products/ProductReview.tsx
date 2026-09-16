"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Loader2, Star } from "lucide-react";
import clsx from 'clsx';
import { toast } from 'react-hot-toast';
import { Review } from '@/types';

export type ReviewFormInputs = {
  customerName: string;
  review: string;
  rating: number;
};

export interface ProductReviewsProps {
  productSlug?: string;
  reviews?: Review[];
  isLoading?: boolean;
  onSubmitReview?: (data: ReviewFormInputs) => Promise<void>;
  isSubmitting?: boolean;
}

export function ProductReviews({
  reviews = [],
  isLoading = false,
  onSubmitReview,
  isSubmitting: isExternalSubmitting = false,
}: ProductReviewsProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);

  const isSubmitting = isExternalSubmitting || internalSubmitting;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormInputs>();

  const onSubmit: SubmitHandler<ReviewFormInputs> = async (data) => {
    if (!selectedRating) {
      toast.error("Please select a star rating");
      return;
    }

    if (onSubmitReview) {
      try {
        setInternalSubmitting(true);
        await onSubmitReview({ ...data, rating: selectedRating });
        reset();
        setSelectedRating(0);
        setShowForm(false);
        toast.success("Review submitted!");
      } catch (err) {
        toast.error("Failed to submit review");
      } finally {
        setInternalSubmitting(false);
      }
    }
  };

  const renderStars = (count: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={clsx(
          "w-4 h-4",
          i < count ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-neutral-700"
        )}
      />
    ));

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Customer Reviews</h2>
        {onSubmitReview && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-md hover:opacity-90 transition"
          >
            {showForm ? "Cancel" : "Write a Review"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 p-4 border dark:border-neutral-800 rounded-lg space-y-4 max-w-xl"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              {...register("customerName", { required: "Name is required" })}
              className="w-full border dark:border-neutral-700 rounded p-2 text-sm bg-transparent"
              placeholder="e.g. Ama Mensah"
            />
            {errors.customerName && (
              <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => {
                    setSelectedRating(star);
                    setValue("rating", star);
                  }}
                >
                  <Star
                    className={clsx(
                      "w-6 h-6 cursor-pointer transition",
                      star <= selectedRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 dark:text-neutral-700"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Review</label>
            <textarea
              {...register("review", { required: "Review text is required" })}
              className="w-full border dark:border-neutral-700 rounded p-2 text-sm bg-transparent"
              rows={3}
              placeholder="What did you like or dislike about this product?"
            />
            {errors.review && (
              <p className="text-red-500 text-xs mt-1">{errors.review.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b dark:border-neutral-800 pb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">{r.name}</span>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex mb-2">{renderStars(r.rating)}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
