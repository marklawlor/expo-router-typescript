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