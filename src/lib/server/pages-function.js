export function pagesFunction(handler) {
  return (event) => handler({
    ...event,
    env: event.platform?.env ?? {}
  });
}
