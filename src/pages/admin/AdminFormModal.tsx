import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { ProgressStatus } from "../../enums/progress";
import { useStudyStore } from "../../stores/useStudyStore";

interface AdminFormModalProps {
  readonly initialData: any | null;
  readonly onClose: () => void;
  readonly onSave: (payload: any) => void;
  readonly isSaving: boolean;
}

export const AdminFormModal: React.FC<AdminFormModalProps> = ({
  initialData,
  onClose,
  onSave,
  isSaving,
}) => {
  const subjects = useStudyStore((state) => state.subjects);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    is_subject: true,
    parentId: "",
    status: ProgressStatus.NOT_STARTED,
    preliMarks: "",
    comments: "",
    startedDate: "",
    targetToCompleteDate: "",
    completedDate: "",
  });

  const [links, setLinks] = useState<{ title: string; link: string; sourceName: string }[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || "",
        name: initialData.name || "",
        is_subject: initialData.is_subject !== undefined ? initialData.is_subject : (!initialData.parentId),
        parentId: initialData.parentId || "",
        status: initialData.status || ProgressStatus.NOT_STARTED,
        preliMarks: initialData.preliMarks || "",
        comments: initialData.comments || "",
        startedDate: initialData.startedDate || "",
        targetToCompleteDate: initialData.targetToCompleteDate || "",
        completedDate: initialData.completedDate || "",
      });

      if (initialData.links && Array.isArray(initialData.links)) {
        setLinks(initialData.links);
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ 
        ...prev, 
        [name]: checked,
        // If it's a subject, clear parentId. If chapter, keep it empty until selected.
        parentId: checked ? "" : prev.parentId 
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddLink = () => {
    setLinks([...links, { title: "", link: "", sourceName: "" }]);
  };

  const handleLinkChange = (index: number, field: string, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.is_subject && !formData.parentId) {
      alert("A Chapter must have a Parent Subject selected.");
      return;
    }

    const payload: any = {
      name: formData.name,
      is_subject: formData.is_subject,
      parentId: formData.is_subject ? "" : formData.parentId,
      status: formData.status,
      preliMarks: formData.preliMarks,
      comments: formData.comments,
      startedDate: formData.startedDate,
      targetToCompleteDate: formData.targetToCompleteDate,
      completedDate: formData.completedDate,
      links: links.filter(l => l.title || l.link || l.sourceName), // filter out empty rows
    };

    if (initialData) {
      payload.id = initialData.id;
    } else {
      payload.id = formData.id;
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-base border border-border-subtle rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-bg-base z-10">
          <h2 className="text-xl font-bold text-text-primary">
            {initialData ? "Edit Node" : "Create New Node"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-surface-hover hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-bg-surface-hover p-4 rounded-lg border border-border-subtle flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_subject"
                checked={formData.is_subject}
                onChange={handleChange}
                className="w-4 h-4 text-primary bg-bg-surface border-border-subtle rounded focus:ring-primary focus:ring-2"
              />
              <span className="text-sm font-semibold text-text-primary">This is a Subject</span>
            </label>
            <span className="text-xs text-text-muted">
              (Uncheck this if it's a Chapter)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">ID *</label>
              <input
                type="text"
                name="id"
                required
                disabled={!!initialData}
                value={formData.id}
                onChange={handleChange}
                placeholder="Unique ID"
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            {!formData.is_subject && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Parent Subject *</label>
                <select
                  name="parentId"
                  required
                  value={formData.parentId}
                  onChange={handleChange}
                  className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                >
                  <option value="">Select a Subject...</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value={ProgressStatus.NOT_STARTED}>Not Started</option>
                <option value={ProgressStatus.IN_PROGRESS}>In Progress</option>
                <option value={ProgressStatus.COMPLETED}>Completed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Preli Marks</label>
              <input
                type="number"
                name="preliMarks"
                value={formData.preliMarks}
                onChange={handleChange}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Started Date</label>
              <input
                type="text"
                name="startedDate"
                value={formData.startedDate}
                onChange={handleChange}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                placeholder="e.g. 2024-05-12"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Target to Complete Date</label>
              <input
                type="text"
                name="targetToCompleteDate"
                value={formData.targetToCompleteDate}
                onChange={handleChange}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Completed Date</label>
              <input
                type="text"
                name="completedDate"
                value={formData.completedDate}
                onChange={handleChange}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary">Comments</label>
            <textarea
              name="comments"
              rows={2}
              value={formData.comments}
              onChange={handleChange}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-text-primary">Links & Resources</label>
              <button
                type="button"
                onClick={handleAddLink}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Link
              </button>
            </div>
            
            {links.length === 0 ? (
              <p className="text-xs text-text-muted italic">No links added.</p>
            ) : (
              <div className="space-y-3">
                {links.map((link, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-bg-surface-hover p-3 rounded-lg border border-border-subtle">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                      <input
                        type="text"
                        placeholder="Title"
                        value={link.title}
                        onChange={(e) => handleLinkChange(idx, "title", e.target.value)}
                        className="w-full bg-bg-surface border border-border-subtle rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                      />
                      <input
                        type="url"
                        placeholder="URL (https://...)"
                        value={link.link}
                        onChange={(e) => handleLinkChange(idx, "link", e.target.value)}
                        className="w-full bg-bg-surface border border-border-subtle rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="Source Name"
                        value={link.sourceName}
                        onChange={(e) => handleLinkChange(idx, "sourceName", e.target.value)}
                        className="w-full bg-bg-surface border border-border-subtle rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="p-1.5 text-status-notstarted hover:bg-status-notstarted/10 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-text-primary bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {isSaving ? "Saving..." : initialData ? "Save Changes" : "Create Node"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AdminFormModal.displayName = "AdminFormModal";
