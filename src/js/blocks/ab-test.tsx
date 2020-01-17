import React, { Component } from 'react';
import shortid from 'shortid';
import queryString from 'query-string';

import { __, sprintf } from '@wordpress/i18n';
import { registerBlockType, createBlock, BlockInstance } from '@wordpress/blocks';
import { InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { withDispatch, select } from '@wordpress/data';

import VariantSelector from '../components/VariantSelector/VariantSelector';
import BoxShadow from '../components/BoxShadow/BoxShadow';
import DistributionSettings from '../components/DistributionSettings/DistributionSettings';
import GoalSelector from '../components/GoalSelector/GoalSelector';
import ControlSettings from '../components/ControlSettings/ControlSettings';
import GeneralSettings from '../components/GeneralSettings/GeneralSettings';
import TestResults from '../components/TestResults/TestResults';
import Onboarding from '../components/Onboarding/Onboarding';

import { getOption, setOption } from '../helpers/options';

import SVGIcon from '../components/Logo/Logo';

type ABTestBlockProps = BlockInstance<ABTestAttributes> & {
  setAttributes: (attrs: any) => void;
  onDeclareWinner: (id: string) => void;
  selectBlock: () => void;
};

const ALLOWED_BLOCKS = ['ab-testing-for-wp/ab-test-block-variant'];

const makeTemplate = (variant: ABTestVariant): [string, ABTestVariant] => ['ab-testing-for-wp/ab-test-block-variant', variant];

function isSingleTest(): boolean {
  const { getCurrentPostType } = select('core/editor');
  return getCurrentPostType() === 'abt4wp-test';
}

class ABTestBlock extends Component<ABTestBlockProps> {
  currentVariant: string | undefined;

  componentDidMount(): void {
    this.selectOnSingleTest();
    this.focusTestIntoView();
  }

  selectOnSingleTest(): void {
    const { selectBlock } = this.props;

    setTimeout(() => { if (isSingleTest()) selectBlock(); }, 0);
  }

  focusTestIntoView(): void {
    const { attributes, clientId, selectBlock } = this.props;
    const { test } = queryString.parse(window.location.search);

    // check if test from querystring is this test
    if (attributes.id !== test) return;

    // this hack is needed for Gutenberg :(
    setTimeout(() => {
      // find the block in the content
      const block = document.getElementById(`block-${clientId}`);
      if (!block) return;

      // scroll to block
      block.scrollIntoView({ block: 'center' });

      // select block in editor
      selectBlock();
    }, 0);
  }

  showVariant(id: string, selected?: ABTestVariant): void {
    if (!selected) return;
    if (this.currentVariant === selected.id) return;

    const variants = document.querySelectorAll<HTMLElement>(`.ABTest--${id} .wp-block[data-type="ab-testing-for-wp/ab-test-block-variant"]`);

    // if DOM is not mounted yet, try again on first possibility
    if (variants.length === 0) setTimeout(() => this.showVariant(id, selected), 0);

    variants.forEach((variant) => {
      if (!selected) return;

      const hasSelected = variant.querySelector(`.ABTestVariant--${selected.id}`);
      if (hasSelected) {
        variant.style.display = 'block'; // eslint-disable-line

        // update current variant
        this.currentVariant = selected.id;
        return;
      }

      variant.style.display = 'none'; // eslint-disable-line
    });
  }

  render(): React.ReactNode {
    const {
      clientId,
      attributes,
      setAttributes,
      onDeclareWinner,
      selectBlock,
    } = this.props;

    const {
      id,
      variants,
      title,
      postGoal,
      postGoalType,
      control,
      isEnabled,
      startedAt,
      completedOnboarding,
      defaultContent,
    } = attributes;

    const cancelOnboarding = (): void => {
      setOption('completedOnboarding', true);
      setAttributes({ completedOnboarding: true });
    };

    // initialize attributes
    if (!id) {
      const defaultVariants: ABTestVariant[] = [
        {
          id: shortid.generate(),
          name: 'A',
          selected: true,
          distribution: 50,
          defaultContent,
        },
        {
          id: shortid.generate(),
          name: 'B',
          selected: false,
          distribution: 50,
          defaultContent,
        },
      ];

      const { getCurrentPost } = select('core/editor');
      const postTitle = getCurrentPost<{ title: string }>().title;

      setAttributes({
        id: shortid.generate(),
        variants: defaultVariants,
        postGoal: 0,
        postGoalType: '',
        title: isSingleTest() ? '' : sprintf(__('New test on "%s"'), postTitle),
        control: defaultVariants[0].id,
        isEnabled: false,
      });
    }

    const onSelectVariant = (variantId: string): void => {
      setAttributes({
        variants: variants.map((variant) => ({ ...variant, selected: variant.id === variantId })),
      });
    };
    const onUpdateVariants = (newVariants: ABTestVariant[]): void => setAttributes({
      variants: newVariants,
    });
    const onTitleChange = (newTitle: string): void => setAttributes({ title: newTitle });
    const onPostGoalChange = (postId: number): void => setAttributes({ postGoal: postId });
    const onPostGoalTypeChange = (type: string): void => setAttributes({ postGoalType: type });
    const onControlChange = (variantId: string): void => setAttributes({ control: variantId });
    const onEnabledChange = (enabled: boolean): void => setAttributes({
      isEnabled: enabled,
      // set start time if no start time is known
      startedAt: enabled && !startedAt ? new Date() : startedAt,
    });

    const selectedVariant = variants.find((variant) => variant.selected);

    // side effect...
    this.showVariant(id, selectedVariant);

    const showOnboarding = !completedOnboarding
      && window.innerWidth > 780
      && window.location.search.indexOf('skipOnboarding=1') === -1;
    const isSingle = isSingleTest();

    return (
      <div className={`ABTest--${id}`}>
        {showOnboarding && (
          <Onboarding
            clientId={clientId}
            cancelOnboarding={cancelOnboarding}
            selectBlock={selectBlock}
          />
        )}

        <style>{`.ABTest--${id} .wp-block[data-type="ab-testing-for-wp/ab-test-block-variant"] { display: none; }`}</style>

        <InspectorControls>
          <GeneralSettings
            isSingle={isSingle}
            title={title}
            isEnabled={isEnabled}
            onChangeTitle={onTitleChange}
            onChangeEnabled={onEnabledChange}
          />
          <TestResults
            isEnabled={isEnabled}
            testId={id}
            control={control}
            startedAt={typeof startedAt === 'string' ? parseInt(startedAt, 10) : startedAt}
            onDeclareWinner={onDeclareWinner}
          />
          <DistributionSettings
            variants={variants}
            onUpdateVariants={onUpdateVariants}
          />
          <GoalSelector
            value={postGoal}
            type={postGoalType}
            onChange={onPostGoalChange}
            onTypeChange={onPostGoalTypeChange}
          />
          <ControlSettings
            value={control}
            variants={variants}
            onChange={onControlChange}
          />
        </InspectorControls>

        <InnerBlocks
          templateLock="all"
          template={variants.map(makeTemplate)}
          allowedBlocks={ALLOWED_BLOCKS}
        />
        <VariantSelector
          variants={variants}
          onSelectVariant={onSelectVariant}
        />
        <BoxShadow />
      </div>
    );
  }
}

const edit: any = withDispatch((dispatch, props: any) => {
  const { removeBlock } = dispatch('core/block-editor');
  const { getBlock } = select('core/block-editor');
  const { clientId, insertBlocksAfter } = props;

  return {
    onDeclareWinner(variantId: string): void {
      const rootBlock = getBlock(clientId);

      if (!rootBlock) return;

      const variantBlock = rootBlock.innerBlocks
        .find((block) => block.attributes && block.attributes.id === variantId);

      if (!variantBlock) return;

      // copy inner blocks of variant
      const blockCopies = variantBlock.innerBlocks.map((block: any) => createBlock(
        block.name,
        block.attributes,
        block.innerBlocks,
      ));

      // insert blocks after test
      insertBlocksAfter(blockCopies);

      // remove test
      removeBlock(clientId);
    },
    selectBlock(): void {
      const { selectBlock } = dispatch('core/block-editor');
      const { openGeneralSidebar } = dispatch('core/edit-post');
      selectBlock(clientId);
      openGeneralSidebar('edit-post/block');
    },
  };
})(ABTestBlock as any);

registerBlockType('ab-testing-for-wp/ab-test-block', {
  title: __('A/B Test Container'),
  description: __('A/B test container which contains the possible variants.'),
  icon: SVGIcon,
  category: 'widgets',
  supports: {
    inserter: false,
  },
  attributes: {
    id: {
      type: 'string',
      default: '',
    },
    variants: {
      type: 'array',
      default: [],
    },
    title: {
      type: 'string',
      default: '',
    },
    control: {
      type: 'string',
      default: '',
    },
    isEnabled: {
      type: 'boolean',
      default: false,
    },
    postGoal: {
      type: 'number',
      default: 0,
    },
    postGoalType: {
      type: 'string',
      default: '',
    },
    startedAt: {
      type: 'string',
      default: '',
    },
    completedOnboarding: {
      type: 'boolean',
      default: !!getOption('completedOnboarding'),
    },
    defaultContent: {
      type: 'array',
      default: undefined,
    },
  },
  edit,
  save() {
    return <div><InnerBlocks.Content /></div>;
  },
});
