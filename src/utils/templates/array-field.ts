export const arrayFieldTemplate = {
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
				<div key={field.id} className="flex items-center space-x-2">
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
			size="icon"
			variant="ghost"
			type="button"
			onClick={() => append(<%= defaultValues %>)}
			>
				<PlusIcon className="size-4" />
			</Button>
	</div>`,
};
