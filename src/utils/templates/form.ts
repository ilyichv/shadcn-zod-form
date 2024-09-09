export const formTemplate = `
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
<%= schemaImport %>
<%= imports %>
import { Button } from "@/registry/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/registry/ui/form"

const formSchema = <%= schema %>

export function <%= formName %>() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: <%= defaultValues %>,
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle form submission
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <%= components %>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
`;
