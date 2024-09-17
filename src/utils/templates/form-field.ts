export const formFieldTemplate = `<FormField
  control={form.control}
  name=<%= name %>
  render={({ field }) => (
    <FormItem>
      <FormLabel><%= label %></FormLabel>
      <FormControl>
        <%= input %>
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
`;
