'use server'; // This sets all actions as server fuctions
import { sql } from '@vercel/postgres';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than 0' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true }); // id and date are optional
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validateFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // Or you can use const rawFormData = Object.fromEntries(formData.entries())

  // Validate the fields and return error if failed validation
  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice',
    };
  }

  const { customerId, amount, status } = validateFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  } catch (error) {
    return {
      message: 'Error creating invoice',
    };
  }

  revalidatePath('/dashboard/invoices'); // clear cache and trigger a new request to the server
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prev: State,
  formData: FormData,
) {
  const validateFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // Or you can use const rawFormData = Object.fromEntries(formData.entries())

  if (!validateFields.success) {
    return {
      message: 'Update Invoice Failed',
      errors: validateFields.error.flatten().fieldErrors,
    };
  }

  const { customerId, amount, status } = validateFields.data;

  const amountInCents = amount * 100;

  try {
    await sql`
  UPDATE invoices
  SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
  WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: 'Error updating invoice',
    };
  }

  revalidatePath('/dashboard/invoices'); // clear cache and trigger a new request to the server
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await sql`
  DELETE FROM invoices
  WHERE id = ${id}
  `;
  } catch (error) {
    return {
      message: 'Error deleting invoice',
    };
  }

  revalidatePath('/dashboard/invoices'); // clear cache and trigger a new request to the server
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials';
        default:
          return 'Something went wrong';
      }
    }
    throw error;
  }
}
