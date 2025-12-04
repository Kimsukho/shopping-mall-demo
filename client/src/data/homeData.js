import { faShirt, faBagShopping } from '@fortawesome/free-solid-svg-icons'

export const categories = [
  { name: 'Dresses', icon: faShirt, className: 'dresses' },
  { name: 'Tops', icon: faShirt, className: 'tops' },
  { name: 'Bottoms', icon: faShirt, className: 'bottoms' },
  { name: 'Accessories', icon: faBagShopping, className: 'accessories' },
]

export const mockProducts = [
  { id: 1, name: 'Product Name 1', currentPrice: '39.99', originalPrice: '59.99', badge: 'NEW' },
  { id: 2, name: 'Product Name 2', currentPrice: '39.99', originalPrice: '59.99', badge: 'NEW' },
  { id: 3, name: 'Product Name 3', currentPrice: '39.99', originalPrice: '59.99', badge: 'NEW' },
  { id: 4, name: 'Product Name 4', currentPrice: '39.99', originalPrice: '59.99', badge: 'NEW' },
  { id: 5, name: 'Product Name 5', currentPrice: '39.99', originalPrice: '59.99', badge: 'NEW' },
  { id: 6, name: 'Product Name 6', currentPrice: '39.99', originalPrice: '59.99', badge: 'NEW' },
]

export const heroContent = {
  badge: '+11.11 Sale+',
  title: '30% Off',
  subtitle: 'Everything',
  description: 'Discover the latest trends and express your unique style',
}

export const newsletterContent = {
  title: 'Join Our Community',
  description: 'Subscribe to get exclusive deals, style tips, and early access to new collections',
  privacyText: 'By subscribing you agree to our Privacy Policy',
}

