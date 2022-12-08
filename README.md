# expo-router-typescript

Experimental Typescript support for Expo Router

```tsx
// app/[id].ts
import { Text } from "react-native";

type RouteProps<T> = {
  route: {
    params: T;
  };
};

interface PageParams {
  id2: string; // <--- Wrong parameter 
}

export default function BlogPost({ route }: RouteProps<PageParams>) {
                                                    // ^? Missing "id" from route params.
                                                    // ^? Attribute "id2" is not found on the route.
  return <Text>{route.params.id}</Text>;
}
```

## TODO list

[ ] Provide base types
[ ] Validating route props
  [x] Single
  [ ] Spread
[ ] useLink href validation
[ ] useHref param validation


## Limitations

This is a typescript plugin, meaning it only enhances your editor experience. Errors are not caught by `tsc` and are only to improving the development experience.

This library does not perform type checking, it uses the file's AST to determine if you are doing things correctly. This adds a few limitations

- It will only validate interfaces within the same file
- Interface inheritance is not evaluated and may give false positives
- Type intersections and/or unions are not evaluated and may give false positives