export default function Button({ children, variant = 'default', className = '', ...props }) {
  const variantClass = {
    default: '',
    primary: 'btn-primary',
    danger: 'btn-danger',
    ghost: 'btn-ghost',
  }[variant];

  return (
    <button className={`btn ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
