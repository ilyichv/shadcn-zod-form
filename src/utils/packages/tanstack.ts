import { z } from "zod";
import type { PackageConfig, Template } from ".";

const arrayField: Template = {
	import: `import { XIcon, PlusIcon } from "lucide-react";`,
	functions: "",
	component: `
       <form.Field
        name="<%= name %>"
        mode="array"
        children={(field) => {
            return (<FieldSet>
                <FieldGroup>
                {field.state.value.map((_, index) => (
                   <div key={index} className="flex w-full items-end space-x-2">
					<%= children %>
					<Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => field.removeValue(index)}
                    >
                        <XIcon className="size-4" />
                    </Button>
                    </div>
                ))}
                </FieldGroup>
                 <Button
			size="sm"
			className="mt-2"
			type="button"
			onClick={() => field.pushValue(<%= defaultValues %>)}
			>
				<PlusIcon className="size-4" />
				<span className="ml-2">Add Item</span>
		</Button>
            </FieldSet>
            )
        }}
        />
		
`,
};

const field = `<form.Field
  name=<%= name %>
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (<Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}><%= label %></FieldLabel>
      <%= input %>
      {isInvalid && (
        <FieldError errors={field.state.meta.errors} />
      )}
    </Field>)
  }}
/>
`;

const form = `"use client";

import { useForm } from "@tanstack/react-form"
<%= schemaImport %>
<%= imports %>
import { Button } from "@/registry/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/registry/ui/field";

const formSchema = <%= schema %>;

export function <%= formName %>() {
  const form = useForm({
    defaultValues: <%= defaultValues %>,
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      // Handle form submission
      console.log(value)
    }
  });

  <%= functions %>

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }} 
      className="space-y-8"
    >
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
		component: `<Input 
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid} 
                    />`,
	},
	[z.ZodNumber.name]: {
		import: "import { Input } from '@/registry/ui/input';",
		component: `<Input 
                      type='number' 
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                      aria-invalid={isInvalid} 
                    />`,
	},
	[z.ZodBoolean.name]: {
		import: "import { Checkbox } from '@/registry/ui/checkbox';",
		component:
			"<Checkbox name={field.name} checked={field.state.value} onCheckedChange={field.handleChange} />",
	},
	[z.ZodEnum.name]: {
		import:
			"import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@/registry/ui/select';",
		component: `<Select 
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}>
      <SelectTrigger aria-invalid={isInvalid} className="w-[180px]">
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

export const tanstackConfig: PackageConfig = {
	prefix: (prefix) => `${prefix}[\${index}]`,
	templates: {
		form,
		field,
		arrayField,
		inputs,
		optionItem,
	},
};
