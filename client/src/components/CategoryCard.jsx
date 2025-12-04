import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function CategoryCard({ name, icon, className }) {
  return (
    <div className="category-card">
      <div className={`category-image ${className}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <h3 className="category-name">{name}</h3>
    </div>
  )
}

export default CategoryCard

