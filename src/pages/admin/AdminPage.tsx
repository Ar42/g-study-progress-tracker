import React, { useState } from "react";
import { useStudyStore } from "../../stores/useStudyStore";
import { useExecuteAdminActionMutation } from "../../services/adminApi";
import { useLazyFetchStudyDataQuery } from "../../services/sheetApi";
import { Card } from "../../components/ui/Card";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { AdminFormModal } from "./AdminFormModal";

export const AdminPage: React.FC = () => {
  const subjects = useStudyStore((state) => state.subjects);
  const showToast = useStudyStore((state) => state.showToast);
  const setSubjects = useStudyStore((state) => state.setSubjects);
  
  const [executeAdminAction, { isLoading }] = useExecuteAdminActionMutation();
  const [triggerFetch] = useLazyFetchStudyDataQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<any | null>(null);

  // Flatten the recursive tree to a simple list for the admin table
  const flattenNodes = (nodes: readonly any[]): any[] => {
    let result: any[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children) {
        result = result.concat(flattenNodes(node.children));
      }
    });
    return result;
  };

  const flatNodes = flattenNodes(subjects);

  const handleCreate = () => {
    setEditingNode(null);
    setIsModalOpen(true);
  };

  const handleEdit = (node: any) => {
    // Determine parentId based on where it lives in the tree if we want to be strict,
    // but the node itself might not store its parentId in our reconstructed state. 
    // We should ideally pass the parentId down during parsing or find it here.
    // For simplicity, we can try to locate it, or just use what we have.
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this row?")) return;
    
    try {
      await executeAdminAction({
        action: "DELETE",
        payload: { id }
      }).unwrap();
      
      showToast("Row deleted successfully!", "success");
      
      // Resync data
      const data = await triggerFetch().unwrap();
      if (data) setSubjects(data);
    } catch (e) {
      showToast("Failed to delete row.", "error");
    }
  };

  const onSave = async (payload: any) => {
    const action = editingNode ? "UPDATE" : "CREATE";
    try {
      await executeAdminAction({
        action,
        payload
      }).unwrap();
      
      showToast(`Row ${action === "CREATE" ? "created" : "updated"} successfully!`, "success");
      setIsModalOpen(false);
      
      // Resync data
      const data = await triggerFetch().unwrap();
      if (data) setSubjects(data);
    } catch (e) {
      showToast(`Failed to ${action.toLowerCase()} row.`, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Admin Panel</h1>
          <p className="text-sm text-text-secondary">Manage your Study Tracker data directly.</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-text-primary rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add New Node
        </button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-bg-surface-hover text-xs uppercase border-b border-border-subtle">
              <tr>
                <th className="px-6 py-4 font-medium text-text-primary">ID</th>
                <th className="px-6 py-4 font-medium text-text-primary">Name</th>
                <th className="px-6 py-4 font-medium text-text-primary">Status</th>
                <th className="px-6 py-4 font-medium text-text-primary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {flatNodes.map((node) => (
                <tr key={node.id} className="hover:bg-bg-surface-hover/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{node.id}</td>
                  <td className="px-6 py-4 font-medium text-text-primary truncate max-w-[200px]">{node.name}</td>
                  <td className="px-6 py-4">
                    {node.status ? (
                      <span className="px-2 py-1 bg-bg-surface border border-border-subtle rounded text-xs font-semibold">
                        {node.status.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-text-muted italic">Parent</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3 flex justify-end">
                    <button
                      onClick={() => handleEdit(node)}
                      className="text-primary hover:text-primary-hover p-1"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(node.id)}
                      className="text-status-notstarted hover:text-red-400 p-1"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {flatNodes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-text-muted">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <AdminFormModal
          initialData={editingNode}
          onClose={() => setIsModalOpen(false)}
          onSave={onSave}
          isSaving={isLoading}
        />
      )}
    </div>
  );
};

AdminPage.displayName = "AdminPage";
