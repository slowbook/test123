import { Client, Environment } from 'square';

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
});

export const processPayment = async (paymentData) => {
  try {
    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId: paymentData.sourceId,
      amountMoney: {
        amount: BigInt(Math.round(paymentData.amount * 100)), // Convert to cents
        currency: paymentData.currency,
      },
      locationId: process.env.SQUARE_LOCATION_ID || '',
      idempotencyKey: `${paymentData.appointmentId}-${Date.now()}`,
    });

    return {
      paymentId: result.payment?.id,
      status: result.payment?.status,
      receiptUrl: result.payment?.receiptUrl,
    };
  } catch (error) {
    console.error('Square payment error:', error);
    throw new Error(error.message || 'Payment processing failed');
  }
};

export const refundPayment = async (paymentId, amount, currency) => {
  try {
    const { result } = await squareClient.refundsApi.refundPayment({
      paymentId,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency,
      },
      idempotencyKey: `refund-${paymentId}-${Date.now()}`,
    });

    return {
      refundId: result.refund?.id,
      status: result.refund?.status,
    };
  } catch (error) {
    console.error('Square refund error:', error);
    throw new Error(error.message || 'Refund processing failed');
  }
};
