'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Heading from '@tiptap/extension-heading';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, Palette } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const colors = ['#000000', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#862e9c', '#ffffff', '#868e96'];

  return (
    <div className="border border-input bg-card rounded-t-md p-1 flex flex-wrap items-center gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
       <Separator orientation="vertical" className="h-8 mx-1" />
       <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                 <Palette className="h-4 w-4" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                    <Button
                        key={color}
                        variant={editor.isActive('textStyle', { color }) ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        style={{ backgroundColor: color }}
                        onClick={() => editor.chain().focus().setColor(color).run()}
                    />
                ))}
                 <Button
                    variant="outline"
                    size="sm"
                    className="col-span-4 h-8"
                    onClick={() => editor.chain().focus().unsetColor().run()}
                >
                    Reset
                </Button>
            </div>
        </PopoverContent>
       </Popover>
    </div>
  );
};


export const RichTextEditor = ({ content, onChange }: { content: string, onChange: (richText: string) => void }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
          heading: {
              levels: [1, 2, 3],
          },
      }),
      TextStyle,
      Color,
      Heading.configure({
        levels: [1, 2, 3],
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: cn(
            'min-h-[150px] w-full rounded-b-md border-t-0 border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            'prose prose-sm sm:prose-base max-w-none [&_ol]:list-decimal [&_ul]:list-disc'
        ),
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="flex flex-col justify-stretch">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
