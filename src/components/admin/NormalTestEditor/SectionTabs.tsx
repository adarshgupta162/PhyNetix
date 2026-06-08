import { useState } from "react";
import { Plus, Edit2, Trash2, GripVertical, MoreHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  test_id: string;
  name: string;
  order_index: number;
}

interface Section {
  id: string;
  subject_id: string;
  name: string | null;
  section_type: string;
  order_index: number;
}

interface SectionTabsProps {
  subjects: Subject[];
  sections: Section[];
  activeSubjectId: string | null;
  activeSectionId: string | null;
  onSubjectSelect: (subjectId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onAddSubject: (name: string) => Promise<void>;
  onAddSection: (name: string, type: string) => Promise<void>;
  onRenameSubject: (subjectId: string, name: string) => Promise<void>;
  onRenameSection: (sectionId: string, name: string) => Promise<void>;
  onDeleteSubject: (subjectId: string) => Promise<void>;
  onDeleteSection: (sectionId: string) => Promise<void>;
}

const SECTION_TYPES = [
  { value: 'single_choice', label: 'Single Correct MCQ' },
  { value: 'multiple_choice', label: 'Multiple Correct MCQ' },
  { value: 'integer', label: 'Integer Type' }
];

export function SectionTabs({
  subjects,
  sections,
  activeSubjectId,
  activeSectionId,
  onSubjectSelect,
  onSectionSelect,
  onAddSubject,
  onAddSection,
  onRenameSubject,
  onRenameSection,
  onDeleteSubject,
  onDeleteSection
}: SectionTabsProps) {
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showRenameSubject, setShowRenameSubject] = useState<string | null>(null);
  const [showRenameSection, setShowRenameSection] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'subject' | 'section', id: string } | null>(null);
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('single_choice');
  const [renameValue, setRenameValue] = useState('');

  const currentSubjectSections = sections.filter(s => s.subject_id === activeSubjectId);

  const handleAddSubject = async () => {
    if (newSubjectName.trim()) {
      await onAddSubject(newSubjectName.trim());
      setNewSubjectName('');
      setShowAddSubject(false);
    }
  };

  const handleAddSection = async () => {
    if (newSectionName.trim() || newSectionType) {
      await onAddSection(newSectionName.trim() || SECTION_TYPES.find(t => t.value === newSectionType)?.label || '', newSectionType);
      setNewSectionName('');
      setNewSectionType('single_choice');
      setShowAddSection(false);
    }
  };

  const handleRename = async () => {
    if (renameValue.trim()) {
      if (showRenameSubject) {
        await onRenameSubject(showRenameSubject, renameValue.trim());
        setShowRenameSubject(null);
      } else if (showRenameSection) {
        await onRenameSection(showRenameSection, renameValue.trim());
        setShowRenameSection(null);
      }
      setRenameValue('');
    }
  };

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      if (showDeleteConfirm.type === 'subject') {
        await onDeleteSubject(showDeleteConfirm.id);
      } else {
        await onDeleteSection(showDeleteConfirm.id);
      }
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="border-b border-border bg-card/30">
      {/* Subject Tabs */}
      <div className="flex items-center gap-1 p-2 overflow-x-auto border-b border-border/50">
        {subjects.map(subject => (
          <div key={subject.id} className="flex items-center group">
            <button
              onClick={() => onSubjectSelect(subject.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                activeSubjectId === subject.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary/50 text-foreground hover:bg-secondary"
              )}
            >
              {subject.name}
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    activeSubjectId === subject.id && "opacity-100"
                  )}
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => {
                  setRenameValue(subject.name);
                  setShowRenameSubject(subject.id);
                }}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setShowDeleteConfirm({ type: 'subject', id: subject.id })}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Subject
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAddSubject(true)}
          className="ml-2 text-primary hover:text-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Subject
        </Button>
      </div>

      {/* Section Tabs */}
      {activeSubjectId && (
        <div className="flex items-center gap-1 p-2 overflow-x-auto bg-secondary/20">
          {currentSubjectSections.map(section => (
            <div key={section.id} className="flex items-center group">
              <button
                onClick={() => onSectionSelect(section.id)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all",
                  activeSectionId === section.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {section.name || section.section_type.replace('_', ' ')}
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-5 w-5 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                      activeSectionId === section.id && "opacity-100"
                    )}
                  >
                    <MoreHorizontal className="w-2.5 h-2.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => {
                    setRenameValue(section.name || '');
                    setShowRenameSection(section.id);
                  }}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setShowDeleteConfirm({ type: 'section', id: section.id })}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Section
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddSection(true)}
            className="ml-2 text-xs text-accent-foreground hover:text-accent-foreground"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Section
          </Button>
        </div>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g., Physics, Chemistry"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddSubject(false)}>Cancel</Button>
            <Button onClick={handleAddSubject}>Add Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={showAddSection} onOpenChange={setShowAddSection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Section Name (optional)</Label>
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g., Single Correct MCQ"
              />
            </div>
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select value={newSectionType} onValueChange={setNewSectionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddSection(false)}>Cancel</Button>
            <Button onClick={handleAddSection}>Add Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!showRenameSubject || !!showRenameSection} onOpenChange={() => {
        setShowRenameSubject(null);
        setShowRenameSection(null);
        setRenameValue('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {showRenameSubject ? 'Subject' : 'Section'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Enter new name"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setShowRenameSubject(null);
              setShowRenameSection(null);
            }}>Cancel</Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {showDeleteConfirm?.type === 'subject' ? 'Subject' : 'Section'}?</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-muted-foreground">
            This will permanently delete the {showDeleteConfirm?.type} and all its {showDeleteConfirm?.type === 'subject' ? 'sections and questions' : 'questions'}. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
