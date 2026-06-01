import Button from './Button.jsx';

export default function Modal({ modal, onClose, onConfirm }) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-5">
      <section className="w-full max-w-xl rounded-2xl border border-line bg-panel p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">{modal.title}</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-4">{modal.body}</div>
        {modal.confirmText ? (
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={onConfirm}>{modal.confirmText}</Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
