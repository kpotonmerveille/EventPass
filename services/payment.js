const FEDAPAY_SECRET_KEY = 'sk_live_RA-C2Ex6UOUgW1IV2lUBWxss';

export async function initiatePayment({
  amount,
  description,
  customerName,
  customerPhone,
  customerEmail,
}) {
  const response = await fetch('https://api.fedapay.com/v1/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FEDAPAY_SECRET_KEY}`,
    },
    body: JSON.stringify({
      description,
      amount,
      currency: { iso: 'XOF' },
      callback_url: 'https://eventpass.app/payment-success',
      customer: {
        firstname: customerName,
        phone_number: {
          number: customerPhone,
          country: 'BJ',
        },
        email: customerEmail,
      },
    }),
  });

  const data = await response.json();

  if (data['v1/transaction']) {
    return {
      transactionId: data['v1/transaction'].id,
      status: data['v1/transaction'].status,
    };
  } else {
    throw new Error(JSON.stringify(data));
  }
}