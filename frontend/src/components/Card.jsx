function Card({ children, large = false }) {
  return (
    <div className={`card ${large ? 'card-large' : ''}`}>
      {children}
    </div>
  );
}

export default Card;
