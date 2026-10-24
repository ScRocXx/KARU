import type { ImageSet } from "@/lib/types";

export interface OrderItemView {
  id: string;
  title: string;
  code: string | null;
  image: ImageSet | null;
  price_inr: number;
  maker: { name: string; handle: string };
  karu_id: string | null;
  status: "pending" | "to_pack" | "shipped" | "delivered" | "return_requested" | "returned" | "cancelled";
  courier: string | null;
  tracking_no: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  returnable: boolean;
  return_window_ends_at: string | null;
  can_return: boolean;
  can_confirm_received: boolean;
  can_review: boolean;
  reviewed: boolean;
  return: { status: string; reason: string } | null;
  refund: { status: string; amount_inr: number } | null;
}

export interface OrderView {
  id: string;
  order_number: string;
  status: string;
  total_inr: number;
  total: string;
  subtotal_inr: number;
  shipping_fee_inr: number;
  created_at: string;
  paid_at: string | null;
  payment: { method: string | null; status: string } | null;
  address: Record<string, string | null>;
  items: OrderItemView[];
  return_window_days: number;
}
