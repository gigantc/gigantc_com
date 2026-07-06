import { useState } from 'react';

const AddSectionForm = ({ onAddSection }) => {
  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Section title is required');
      return;
    }

    try {
      setSubmitting(true);
      await onAddSection({ title });
      setTitle('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="addForm">
      <h3>Add New Section</h3>
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Section Title (e.g. Cubs, NFL, Music)"
            disabled={submitting}
          />
        </div>

        {formError && <div className="formError">{formError}</div>}

        <button type="submit" className="btnAdd" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Section'}
        </button>
      </form>
    </div>
  );
};

export default AddSectionForm;
