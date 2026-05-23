'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string);
  const category_id = formData.get('category_id') as string;
  const description = formData.get('description') as string;

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name,
        price,
        stock,
        category_id,
        description,
      },
    ])
    .select();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/');
  return { success: true, data, message: 'Producto creado exitosamente' };
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);
  const stock = parseInt(formData.get('stock') as string);
  const category_id = formData.get('category_id') as string;
  const description = formData.get('description') as string;

  const { data, error } = await supabase
    .from('products')
    .update({
      name,
      price,
      stock,
      category_id,
      description,
    })
    .eq('id', id)
    .select();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/');
  return { success: true, data, message: 'Producto actualizado exitosamente' };
}

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/');
  return { success: true, message: 'Producto eliminado exitosamente' };
}
