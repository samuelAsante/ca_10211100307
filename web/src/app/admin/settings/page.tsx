"use client";

import { getBackendUrl } from "@/lib/backend-url";
import { authHeaders } from "@/lib/auth-token";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModeToggle } from "@/components/layout/toogleMode";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useState } from "react";

type Input = {
  email: string;
  oldPassword: string;
  newPassword: string;
  avatar?: FileList;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  currency?: string;
  logo?: FileList;
};

export default function AdminSettingsPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<Input>();
  const router = useRouter();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Submit handler for account tab
  const onAccountSubmit = async (data: Input) => {
    try {
      let avatarUrl = null;

      if (data.avatar && data.avatar[0]) {
        const formData = new FormData();
        formData.append("file", data.avatar[0]);
        formData.append("upload_preset", "your_upload_preset");

        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/dbugzzv0v/image/upload",
          formData
        );
        avatarUrl = res.data.secure_url;
      }

      const res = await authClient.changePassword({
        newPassword: data.newPassword,
        currentPassword: data.oldPassword,
        revokeOtherSessions: true,
      });

      if (res.error) {
        toast.error(res.error.message || "Failed to update password.");
        return;
      }

      toast.success("Password updated successfully!");
      reset();
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    }
  };

  // Submit handler for business settings
  const onBusinessSubmit = async (data: Input) => {
    try {
      let logoUrl = null;

      if (data.logo && data.logo[0]) {
        const formData = new FormData();
        formData.append("file", data.logo[0]);
        formData.append("upload_preset", "your_upload_preset");

        const res = await axios.post(
          "https://api.cloudinary.com/v1_1/dbugzzv0v/image/upload",
          formData
        );
        logoUrl = res.data.secure_url;
      }
      const backendUrl = getBackendUrl();
      await axios.post(
        `${backendUrl}/api/business-settings`,
        {
          name: data.name,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          currency: data.currency || "GHS",
          logoUrl,
        },
        { headers: authHeaders() }
      );

      toast.success("Business settings updated!");
      reset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save business settings.");
    }
  };

  return (
    <div className="max-w-7xl px-4 py-10">
      <Tabs defaultValue="account" className="w-full">
        {/* Mobile Tab Select */}
        <Select defaultValue="account">
          <SelectTrigger className="flex w-fit md:hidden landscape:hidden">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="appearance">Appearance</SelectItem>
          </SelectContent>
        </Select>

        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid landscape:grid grid-cols-2 mb-12">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* --- Account Settings --- */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onAccountSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email && <span className="text-red-500 text-xs font-medium">{errors.email.message}</span>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Enter Old Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    {...register("oldPassword", { required: "Old password is required" })}
                  />
                  {errors.oldPassword && (
                    <span className="text-red-500 text-xs font-medium">{errors.oldPassword.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register("newPassword", {
                      required: "New password is required",
                      minLength: { value: 8, message: "Minimum 8 characters" },
                    })}
                  />
                  {errors.newPassword && (
                    <span className="text-red-500 text-xs font-medium">{errors.newPassword.message}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Upload Avatar</Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    {...register("avatar")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAvatarPreview(URL.createObjectURL(file));
                    }}
                  />
                  {avatarPreview && (
                    <div className="pt-1">
                      <Image
                        src={avatarPreview}
                        alt="Avatar Preview"
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-full object-cover border"
                      />
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  Update Account
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Appearance Settings --- */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle>Theme</CardTitle>
              <ModeToggle />
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onBusinessSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="logo">Upload Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    {...register("logo")}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLogoPreview(URL.createObjectURL(file));
                    }}
                  />
                  {logoPreview && (
                    <div className="pt-1">
                      <Image
                        src={logoPreview}
                        alt="Logo Preview"
                        width={200}
                        height={64}
                        unoptimized
                        className="h-16 w-auto max-w-[200px] object-contain rounded border p-1"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Business Name</Label>
                  <Input id="name" {...register("name", { required: "Business name is required" })} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register("phone")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...register("address")} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" {...register("state")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...register("country")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" defaultValue="GHS" {...register("currency")} />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  Apply Appearance
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
