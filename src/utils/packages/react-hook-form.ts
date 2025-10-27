import { z } from "zod";
import type { PackageConfig, Template } from ".";

const arrayField: Template = {
	import: `import { useFieldArray } from 'react-hook-form';
	import { XIcon, PlusIcon } from "lucide-react";`,
	functions: `
		const { fields, append, remove } = useFieldArray({
			control: form.control,
			name: "<%= name %>",
		});
	`,
	component: `
		<div>
			{fields.map((field, index) => (
				<div key={field.id} className="flex w-full items-end space-x-2">
					<%= children %>
					<Button
					type="button"
					size="icon"
					variant="ghost"
					onClick={() => remove(index)}
				>
					<XIcon className="size-4" />
				</Button>
			</div>
			))
		}
		<Button
			size="sm"
			className="mt-2"
			type="button"
			onClick={() => append(<%= defaultValues %>)}
			>
				<PlusIcon className="size-4" />
				<span className="ml-2">Add Item</span>
			</Button>
	</div>`,
};

const field = `<Controller
  name=<%= name %>
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={field.name}><%= label %></FieldLabel>
      <%= input %>
      {fieldState.invalid && (
        <FieldError errors={[fieldState.error]} />
      )}
    </Field>
  )}
/>
`;

const form = `"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import type { z } from "zod";
<%= schemaImport %>
<%= imports %>
import { Button } from "@/registry/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/registry/ui/field";

const formSchema = <%= schema %>;

export function <%= formName %>() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission
    console.log(values)
  };

  <%= functions %>

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <FieldGroup>
        <%= components %>
      </FieldGroup>
      <Button type="submit">Submit</Button>
    </form>
  )
}
`;

// todo: migrate to standard json schema
const inputs: Record<string, Template> = {
	[z.ZodString.name]: {
		import: "import { Input } from '@/registry/ui/input';",
		component: "<Input {...field} aria-invalid={fieldState.invalid} />",
	},
	[z.ZodNumber.name]: {
		import: "import { Input } from '@/registry/ui/input';",
		component:
			"<Input {...field} onChange={(e) => field.onChange(Number(e.target.value))} type='number' aria-invalid={fieldState.invalid} />",
	},
	[z.ZodBoolean.name]: {
		import: "import { Checkbox } from '@/registry/ui/checkbox';",
		component:
			"<Checkbox checked={field.value} onCheckedChange={field.onChange} />",
	},
	[z.ZodEnum.name]: {
		import:
			"import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@/registry/ui/select';",
		component: `<Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a value" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <%= children %>
        </SelectGroup>
      </SelectContent>
    </Select>`,
	},
};

const optionItem =
	"<SelectItem value='<%= option %>'><%= option %></SelectItem>";

export const hookFormConfig = {
	prefix: (prefix) => `${prefix}.\${index}`,
	templates: {
		field,
		form,
		arrayField,
		inputs,
		optionItem,
	},
} satisfies PackageConfig;
