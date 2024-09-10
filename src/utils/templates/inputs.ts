export const inputs: Record<string, { import: string; component: string }> = {
	string: {
		import: "import { Input } from '@/registry/ui/input';",
		component: "<Input {...field} />",
	},
	number: {
		import: "import { Input } from '@/registry/ui/input';",
		component: "<Input {...field} />",
	},
	// todo: implement custom registry datepicker
	date: {
		import: "import { Input } from '@/registry/ui/input';",
		component: "<Input {...field} />",
	},
	boolean: {
		import: "import { Checkbox } from '@/registry/ui/checkbox';",
		component:
			"<Checkbox checked={field.value} onCheckedChange={field.onChange} />",
	},
	enum: {
		import:
			"import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from '@/registry/ui/select';",
		component: `<Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a value" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <%= options %>
        </SelectGroup>
      </SelectContent>
    </Select>`,
	},
};

export const optionItem =
	"<SelectItem value='<%= option %>'><%= option %></SelectItem>";
