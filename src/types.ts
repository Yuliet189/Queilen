export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'mujer' | 'hombre' | 'accesorios' | 'ofertas';
  image: string;
  description: string;
  tag?: string;
}

export interface Customer {
  id: string; // This will be the cédula
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface CartItem extends Product {
  quantity: number;
}
