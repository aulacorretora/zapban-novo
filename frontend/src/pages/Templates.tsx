import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Pencil, Trash2, Save, X, MessageSquare } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  content: string;
  trigger: string;
  createdAt: string;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<Template> | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setTemplates([
            {
              id: '1',
              name: 'Welcome Message',
              content: 'Hello! Thanks for contacting us. How can we help you today?',
              trigger: 'hello,hi,hey',
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              name: 'Business Hours',
              content: 'Our business hours are Monday to Friday, 9am to 6pm.',
              trigger: 'hours,open,schedule',
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleCreateTemplate = () => {
    setNewTemplate({
      name: '',
      content: '',
      trigger: '',
    });
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter((template) => template.id !== templateId));
  };

  const handleSaveTemplate = (template: Partial<Template>) => {
    if (editingTemplate) {
      setTemplates(
        templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, ...template }
            : t
        )
      );
      setEditingTemplate(null);
    } else if (newTemplate) {
      const newId = Math.random().toString(36).substring(2, 9);
      setTemplates([
        ...templates,
        {
          id: newId,
          name: template.name || 'Untitled',
          content: template.content || '',
          trigger: template.trigger || '',
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewTemplate(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setNewTemplate(null);
  };

  const renderTemplateForm = (template: Partial<Template>) => (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingTemplate ? 'Edit Template' : 'New Template'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Template Name
            </label>
            <Input
              id="name"
              value={template.name || ''}
              onChange={(e) =>
                editingTemplate
                  ? setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  : setNewTemplate({ ...newTemplate!, name: e.target.value })
              }
              placeholder="e.g., Welcome Message"
            />
          </div>
          <div>
            <label htmlFor="trigger" className="block text-sm font-medium mb-1">
              Trigger Words (comma separated)
            </label>
            <Input
              id="trigger"
              value={template.trigger || ''}
              onChange={(e) =>
                editingTemplate
                  ? setEditingTemplate({ ...editingTemplate, trigger: e.target.value })
                  : setNewTemplate({ ...newTemplate!, trigger: e.target.value })
              }
              placeholder="e.g., hello,hi,hey"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The message will be sent automatically when these words are received
            </p>
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Message Content
            </label>
            <Textarea
              id="content"
              value={template.content || ''}
              onChange={(e) =>
                editingTemplate
                  ? setEditingTemplate({ ...editingTemplate, content: e.target.value })
                  : setNewTemplate({ ...newTemplate!, content: e.target.value })
              }
              placeholder="Enter your template message here..."
              rows={5}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancelEdit}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={() => handleSaveTemplate(template)}
          disabled={!template.name || !template.content}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Template
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Message Templates</h2>
          <p className="text-muted-foreground">
            Create and manage automated response templates
          </p>
        </div>
        <Button onClick={handleCreateTemplate} disabled={!!newTemplate || !!editingTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {(editingTemplate || newTemplate) && (
        <div className="mt-6">
          {renderTemplateForm(editingTemplate || newTemplate!)}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted/50" />
              <CardContent className="h-24 bg-muted/30" />
              <CardFooter className="h-12 bg-muted/20" />
            </Card>
          ))
        ) : templates.length === 0 && !newTemplate ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No templates yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first template to automate responses
            </p>
            <Button className="mt-4" onClick={handleCreateTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Trigger Words:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.trigger.split(',').map((trigger, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                        >
                          {trigger.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Message:</p>
                    <p className="text-sm mt-1 line-clamp-2">{template.content}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
