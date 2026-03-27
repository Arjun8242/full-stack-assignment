function Input({ label, type = 'text', name, value, onChange }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <input
        className="input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default Input;
