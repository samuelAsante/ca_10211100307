export const orderConfirmationTemplate = ({
  name,
  orderId,
  total,
  items,
  paymentRef,
}: {
  name: string;
  orderId: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  paymentRef?: string;
}) => {
  const itemsRows = items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 0; color: #1f2937; font-size: 14px;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 12px 0; text-align: center; color: #4b5563; font-size: 14px;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; text-align: right; color: #1f2937; font-size: 14px; font-weight: 500;">
        GH₵${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed – Order ${orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #4f46e5; padding: 32px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">JS Ashanti</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #e0e7ff;">Thank you for your purchase!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827;">Hi ${name},</h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
                Your payment was received successfully! We have confirmed your order and our team is preparing it for delivery.
              </p>

              <!-- Order Summary Box -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Order ID:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; font-family: monospace;">${orderId}</td>
                </tr>
                ${
                  paymentRef
                    ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Payment Reference:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right; font-family: monospace;">${paymentRef}</td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Status:</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #16a34a; text-align: right;">PAID &amp; CONFIRMED</td>
                </tr>
              </table>

              <!-- Itemized Table -->
              <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">Order Details</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <thead>
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <th align="left" style="padding: 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Item</th>
                    <th align="center" style="padding: 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding: 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Total Breakdown -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #4b5563;">Delivery / Shipping:</td>
                  <td style="padding: 4px 0; font-size: 14px; color: #16a34a; font-weight: 600; text-align: right;">FREE</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 16px; font-weight: 700; color: #111827;">Total Paid:</td>
                  <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #4f46e5; text-align: right;">GH₵${total.toFixed(2)}</td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.5; color: #6b7280;">
                Our dispatch team will contact you shortly before delivery. If you have questions about your order, please reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} JS Ashanti. All rights reserved.</p>
              <p style="margin: 0;">Quality Kitchenware &amp; Home Essentials in Ghana</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
