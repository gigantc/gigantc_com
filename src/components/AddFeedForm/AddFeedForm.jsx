import { useState } from 'react';

const AddFeedForm = ({ onAddFeed }) => {
  const [feedTitle, setFeedTitle] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);


  //////////////////////////////////////
  // VALIDATE URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };


  //////////////////////////////////////
  // HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!feedTitle.trim() || !feedUrl.trim()) {
      setFormError('Both title and URL are required');
      return;
    }

    if (!isValidUrl(feedUrl)) {
      setFormError('Please enter a valid URL');
      return;
    }

    try {
      setSubmitting(true);
      await onAddFeed({ feedTitle, feedUrl });
      // Clear form on success
      setFeedTitle('');
      setFeedUrl('');
      setFormError('');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };


  //////////////////////////////////////
  // RENDER
  return (
    <div className="addForm">
      <h3>Add New Feed</h3>
      <form onSubmit={handleSubmit}>
        <div className="formGroup">
          <input
            id="feedTitle"
            type="text"
            value={feedTitle}
            onChange={(e) => setFeedTitle(e.target.value)}
            placeholder="Feed Title"
            disabled={submitting}
          />
        </div>

        <div className="formGroup">
          <input
            id="feedUrl"
            type="text"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="Feed URL"
            disabled={submitting}
          />
        </div>

        {formError && <div className="formError">{formError}</div>}

        <button type="submit" className="btnAdd" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Feed'}
        </button>
      </form>
    </div>
  );
};

export default AddFeedForm;
