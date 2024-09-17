import { z } from "zod";

export const inputs: Record<
	string,
	{
		import: string;
		component: string;
		defaultValue?: string | boolean | number;
	}
> = {
	[z.ZodString.name]: {
		import: "import { Input } from '@/registry/ui/input';",
		component: "<Input {...field} />",
		defaultValue: "",
	},
	[z.ZodNumber.name]: {
		import: "import { Input } from '@/registry/ui/input';",
		component: "<Input {...field} />",
		defaultValue: 0,
	},
	[z.ZodBoolean.name]: {
		import: "import { Checkbox } from '@/registry/ui/checkbox';",
		component:
			"<Checkbox checked={field.value} onCheckedChange={field.onChange} />",
		defaultValue: false,
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

export const optionItem =
	"<SelectItem value='<%= option %>'><%= option %></SelectItem>";
