import React, { useEffect, useRef } from 'react';
import { select } from 'd3';
import { hierarchy, tree as d3Tree } from 'd3-hierarchy';
import { zoom } from 'd3-zoom';
import '../App.css';
import { IPerson } from '../interfaces/IPersons';

function Tree({ persons, rootPerson, generations }) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!persons || !rootPerson) return;

        const buildHierarchy = (person: IPerson, visited: Map<IPerson, { person: IPerson, children: any[] }> = new Map()) => {
            // if (visited.has(person)) return visited.get(person);

            const node = { person, children: [] };
            visited.set(person, node);

            // if (person.father) node.children.push(buildHierarchy(person.father, visited));
            // if (person.mother) node.children.push(buildHierarchy(person.mother, visited));
            person.children.forEach(child => node.children.push(buildHierarchy(child, visited)));

            return node;
        };

        const dataHierarchy = hierarchy(buildHierarchy(rootPerson));
        const treeLayout = d3Tree().size([
            window.innerWidth - 100,
            generations * 150,
        ]);
        const rootNode = treeLayout(dataHierarchy);
        const svg = select(svgRef.current);
        svg.selectAll('*').remove();

        const g = svg.append('g');

        g.append('g')
            .selectAll('path')
            .data(rootNode.links())
            .join('path')
            .attr('d', d => `
                M${d.source.x},${d.source.y}
                V${(d.source.y + d.target.y) / 2}
                H${d.target.x}
                V${d.target.y}
            `)
            .attr('stroke', 'black')
            .attr('fill', 'none');

        g.append('g')
            .selectAll('rect')
            .data(rootNode.descendants())
            .join('rect')
            .attr('x', d => d.x - 30)
            .attr('y', d => d.y - 15)
            .attr('width', 60)
            .attr('height', 30)
            .attr('rx', 10) // Rounded corners
            .attr('ry', 10) // Rounded corners
            .attr('fill', 'steelblue');

        g.append('g')
            .selectAll('text')
            .data(rootNode.descendants())
            .join('text')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text(d => d.data.firstName)
            .attr('font-size', '12px')
            .attr('fill', 'white');

        const zoomBehavior = zoom()
            .scaleExtent([0.5, 2])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoomBehavior);
    }, [persons, rootPerson, generations]);

    return (
        <div className="App">
            {generations && <h1>Generaties: {generations}</h1>}
            <svg
                ref={svgRef}
                width={window.innerWidth - 100}
                height={generations * 150} // Adjust height dynamically based on generations
            />
        </div>
    );
}

export default Tree;