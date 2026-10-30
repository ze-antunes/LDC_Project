import topology from "../../../public/data/countries-110m.json";
import { feature } from "topojson-client";
export const world = feature(topology, topology.objects.countries);
