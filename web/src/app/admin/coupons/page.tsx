"use client";

import { useState } from "react";
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from "@/hooks/use-coupons";
import { Coupon, CreateCouponInput } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IconTicket,
  IconPlus,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";

export default function AdminCouponsPage() {
  const { data: coupons = [], isLoading, isRefetching, refetch } = useCoupons();
  const createMutation = useCreateCoupon();
  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateCouponInput>({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 10,
    minSubtotal: 0,
    maxDiscount: null,
    maxUses: null,
    expiresAt: null,
    isActive: true,
  });

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      minSubtotal: 0,
      maxDiscount: null,
      maxUses: null,
      expiresAt: null,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minSubtotal: coupon.minSubtotal,
      maxDiscount: coupon.maxDiscount || null,
      maxUses: coupon.maxUses || null,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : null,
      isActive: coupon.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.description) {
      toast.error("Please provide a valid coupon code and description.");
      return;
    }

    try {
      if (editingCoupon) {
        await updateMutation.mutateAsync({
          id: editingCoupon.id,
          data: formData,
        });
        toast.success(`Coupon ${formData.code.toUpperCase()} updated successfully.`);
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(`Coupon ${formData.code.toUpperCase()} created successfully.`);
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save coupon.");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(`Coupon ${code} deleted.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete coupon.");
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await updateMutation.mutateAsync({
        id: coupon.id,
        data: { isActive: !coupon.isActive },
      });
      toast.success(`Coupon ${coupon.code} marked as ${!coupon.isActive ? "active" : "inactive"}.`);
    } catch (err: any) {
      toast.error("Failed to update status.");
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
            <IconTicket className="h-7 w-7 text-red-600" />
            Promo & Coupon Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Create, monitor, and manage discount promo codes for Ashanti&apos;s Kitchenware shoppers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5"
          >
            <IconRefresh className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? "Refreshing..." : "Refresh"}
          </Button>

          <Button onClick={handleOpenCreate} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5">
            <IconPlus className="h-4 w-4" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardDescription>Total Coupons</CardDescription>
            <CardTitle className="text-2xl font-bold">{coupons.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-neutral-500">Configured promotional codes</CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardDescription>Active Campaigns</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-neutral-500">Ready for checkout discount</CardContent>
        </Card>

        <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardDescription>Total Usages</CardDescription>
            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalUsages}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-neutral-500">Orders redeemed with coupons</CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search by coupon code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
            Clear
          </Button>
        )}
      </div>

      {/* Coupons Table */}
      <Card className="shadow-sm border-neutral-200 dark:border-neutral-800">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Min Spend</th>
                <th className="py-3 px-4">Uses</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    Loading coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-500">
                    No coupons found. Click &quot;Seed Default Coupons&quot; or &quot;Create Coupon&quot; to add one.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 px-2.5 py-1 rounded">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-neutral-700 dark:text-neutral-300">
                      {c.description}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                      {c.discountType === "percentage" ? `${c.discountValue}%` : `GH₵ ${c.discountValue.toFixed(2)}`}
                      {c.maxDiscount && (
                        <span className="block text-[11px] font-normal text-neutral-500">
                          Max: GH₵ {c.maxDiscount.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {c.minSubtotal > 0 ? `GH₵ ${c.minSubtotal.toFixed(2)}` : "None"}
                    </td>
                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                      {c.usedCount}
                      {c.maxUses ? ` / ${c.maxUses}` : " (unlimited)"}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        title="Click to toggle status"
                        className="cursor-pointer"
                      >
                        {c.isActive ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                            <IconCheck className="h-3 w-3" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-neutral-500 border-neutral-300 gap-1 text-xs">
                            <IconX className="h-3 w-3" /> Inactive
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(c)}
                          className="h-8 w-8 p-0"
                          title="Edit Coupon"
                        >
                          <IconEdit className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id, c.code)}
                          className="h-8 w-8 p-0 hover:text-red-600 text-neutral-400"
                          title="Delete Coupon"
                        >
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Promotional Coupon"}</DialogTitle>
              <DialogDescription>
                Configure discount rules, spending thresholds, and activation parameters.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                  Coupon Code *
                </label>
                <Input
                  required
                  placeholder="e.g. WELCOME10, CHEF20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                  Description *
                </label>
                <Input
                  required
                  placeholder="e.g. 10% off first cookware set order"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (GH₵)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    Discount Value *
                  </label>
                  <Input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="10"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    Min Subtotal (GH₵)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.minSubtotal}
                    onChange={(e) => setFormData({ ...formData, minSubtotal: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    Max Discount Cap (GH₵)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Optional cap"
                    value={formData.maxDiscount ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscount: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    Max Total Uses
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.maxUses ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUses: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    Expiry Date
                  </label>
                  <Input
                    type="date"
                    value={formData.expiresAt ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expiresAt: e.target.value ? e.target.value : null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-neutral-300 text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Active (immediately available at checkout)
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingCoupon
                  ? "Update Coupon"
                  : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
