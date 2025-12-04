import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram, faFacebook, faTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons'

const Footer = memo(() => {
  const footerLinks = {
    company: [
      { label: 'About Us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Sustainability', href: '#' },
      { label: 'Press', href: '#' },
    ],
    shop: [
      { label: 'New Arrivals', href: '#' },
      { label: 'Best Sellers', href: '#' },
      { label: 'Sale', href: '#' },
      { label: 'Gift Cards', href: '#' },
    ],
    help: [
      { label: 'Shipping & Returns', href: '#' },
      { label: 'Track Order', href: '#' },
      { label: 'Size Guide', href: '#' },
      { label: 'Contact Us', href: '#' },
    ],
  }

  const socialLinks = [
    { icon: faInstagram, label: 'Instagram', href: '#' },
    { icon: faFacebook, label: 'Facebook', href: '#' },
    { icon: faTwitter, label: 'Twitter', href: '#' },
    { icon: faYoutube, label: 'YouTube', href: '#' },
  ]

  const bottomLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Settings', href: '#' },
  ]

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-column">
          <h4 className="footer-heading">Company</h4>
          {footerLinks.company.map((link) => (
            <a key={link.label} href={link.href} className="footer-link">
              {link.label}
            </a>
          ))}
        </div>
        <div className="footer-column">
          <h4 className="footer-heading">Shop</h4>
          {footerLinks.shop.map((link) => (
            <a key={link.label} href={link.href} className="footer-link">
              {link.label}
            </a>
          ))}
        </div>
        <div className="footer-column">
          <h4 className="footer-heading">Help</h4>
          {footerLinks.help.map((link) => (
            <a key={link.label} href={link.href} className="footer-link">
              {link.label}
            </a>
          ))}
        </div>
        <div className="footer-column">
          <h4 className="footer-heading">Follow Us</h4>
          <div className="social-icons">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="social-icon"
                aria-label={social.label}
              >
                <FontAwesomeIcon icon={social.icon} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-copyright">© 2025 FASHIONOVA. All rights reserved.</p>
        <div className="footer-links">
          {bottomLinks.map((link) => (
            <a key={link.label} href={link.href} className="footer-bottom-link">
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export default Footer

