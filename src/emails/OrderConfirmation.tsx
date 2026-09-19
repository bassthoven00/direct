/**
 * src/emails/OrderConfirmation.tsx
 *
 * Example React Email template.
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmationProps {
  orderNumber: string;
  totalAmount: number;
  customerName: string;
}

export const OrderConfirmationEmail = ({
  orderNumber = "DIR-12345",
  totalAmount = 5000,
  customerName = "Guest",
}: OrderConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Your Direct order #{orderNumber} is confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thank you for your order, {customerName}!</Heading>
        <Text style={text}>
          We have received your payment of ${(totalAmount / 100).toFixed(2)}. 
          Your order number is <strong>{orderNumber}</strong>.
        </Text>
        <Text style={text}>
          You will receive another email as soon as there is an update on your order.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const h1 = {
  fontSize: "24px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
};

const text = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#525f7f",
};

export default OrderConfirmationEmail;
